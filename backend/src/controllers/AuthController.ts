import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from '../index'
import { logger, logSecurityEvent } from '../utils/logger'
import { sendSMS } from '../utils/sms'
import { sendEmail } from '../utils/email'
import { generateRandomCode } from '../utils/helpers'

export class AuthController {
  /**
   * 用户注册
   */
  async register(req: Request, res: Response) {
    try {
      const { username, email, phone, password } = req.body

      // 检查用户是否已存在
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            { email },
            { username },
            ...(phone ? [{ phone }] : []),
          ],
        },
      })

      if (existingUser) {
        let message = '用户已存在'
        if (existingUser.email === email) message = '邮箱已被注册'
        else if (existingUser.username === username) message = '用户名已被使用'
        else if (existingUser.phone === phone) message = '手机号已被注册'
        
        return res.status(409).json({
          success: false,
          message,
        })
      }

      // 哈希密码
      const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || '12')
      const passwordHash = await bcrypt.hash(password, saltRounds)

      // 创建用户
      const user = await prisma.user.create({
        data: {
          username,
          email,
          phone,
          passwordHash,
          verificationCode: generateRandomCode(6),
          codeExpiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10分钟后过期
        },
        select: {
          id: true,
          username: true,
          email: true,
          phone: true,
          isVerified: true,
          createdAt: true,
        },
      })

      // 发送验证邮件
      try {
        await sendEmail({
          to: email,
          subject: '欢迎注册 - 抗肿瘤药物临床试验',
          template: 'welcome',
          data: {
            username,
            verificationCode: user.verificationCode,
          },
        })
      } catch (emailError) {
        logger.error('Failed to send welcome email:', emailError)
      }

      logger.info(`User registered: ${user.username} (${user.id})`)

      res.json({
        success: true,
        message: '注册成功，请查收验证邮件',
        data: {
          userId: user.id,
          username: user.username,
        },
      })
    } catch (error) {
      logger.error('Registration error:', error)
      res.status(500).json({
        success: false,
        message: '注册失败，请稍后重试',
      })
    }
  }

  /**
   * 用户登录
   */
  async login(req: Request, res: Response) {
    try {
      const { login, password } = req.body

      // 查找用户（支持邮箱、手机号、用户名登录）
      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { email: login },
            { username: login },
            { phone: login },
          ],
        },
      })

      if (!user) {
        logSecurityEvent('login_failed_user_not_found', { login })
        return res.status(401).json({
          success: false,
          message: '用户名或密码错误',
        })
      }

      // 验证密码
      const isPasswordValid = await bcrypt.compare(password, user.passwordHash)
      if (!isPasswordValid) {
        logSecurityEvent('login_failed_invalid_password', { userId: user.id, login })
        return res.status(401).json({
          success: false,
          message: '用户名或密码错误',
        })
      }

      // 生成JWT Token
      const token = jwt.sign(
        { userId: user.id, username: user.username },
        process.env.JWT_SECRET!,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      )

      // 更新登录信息
      await prisma.user.update({
        where: { id: user.id },
        data: {
          lastLoginAt: new Date(),
          loginCount: { increment: 1 },
        },
      })

      // 创建会话
      const session = await prisma.userSession.create({
        data: {
          userId: user.id,
          sessionToken: jwt.sign(
            { userId: user.id, sessionId: Date.now() },
            process.env.JWT_SECRET!,
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
          ),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7天
        },
      })

      logger.info(`User logged in: ${user.username} (${user.id})`)

      res.json({
        success: true,
        token: session.sessionToken,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          phone: user.phone,
          isVerified: user.isVerified,
        },
      })
    } catch (error) {
      logger.error('Login error:', error)
      res.status(500).json({
        success: false,
        message: '登录失败，请稍后重试',
      })
    }
  }

  /**
   * 用户退出登录
   */
  async logout(req: Request, res: Response) {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '')
      
      if (token) {
        // 删除会话
        await prisma.userSession.deleteMany({
          where: { sessionToken: token },
        })
      }

      logger.info(`User logged out: ${req.user?.userId}`)

      res.json({
        success: true,
        message: '退出登录成功',
      })
    } catch (error) {
      logger.error('Logout error:', error)
      res.status(500).json({
        success: false,
        message: '退出登录失败',
      })
    }
  }

  /**
   * 刷新Token
   */
  async refreshToken(req: Request, res: Response) {
    try {
      const { refreshToken } = req.body

      if (!refreshToken) {
        return res.status(401).json({
          success: false,
          message: 'Refresh token is required',
        })
      }

      // 验证refresh token
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as any

      // 生成新的access token
      const newToken = jwt.sign(
        { userId: decoded.userId, username: decoded.username },
        process.env.JWT_SECRET!,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      )

      res.json({
        success: true,
        token: newToken,
      })
    } catch (error) {
      logger.error('Token refresh error:', error)
      res.status(401).json({
        success: false,
        message: 'Invalid refresh token',
      })
    }
  }

  /**
   * 获取用户信息
   */
  async getProfile(req: Request, res: Response) {
    try {
      const userId = req.user!.userId

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          username: true,
          email: true,
          phone: true,
          isVerified: true,
          emailVerifiedAt: true,
          phoneVerifiedAt: true,
          lastLoginAt: true,
          loginCount: true,
          createdAt: true,
          updatedAt: true,
        },
      })

      if (!user) {
        return res.status(404).json({
          success: false,
          message: '用户不存在',
        })
      }

      res.json({
        success: true,
        data: user,
      })
    } catch (error) {
      logger.error('Get profile error:', error)
      res.status(500).json({
        success: false,
        message: '获取用户信息失败',
      })
    }
  }

  /**
   * 更新用户信息
   */
  async updateProfile(req: Request, res: Response) {
    try {
      const userId = req.user!.userId
      const { username, email, phone } = req.body

      // 检查用户名或邮箱是否已被使用
      const existingUser = await prisma.user.findFirst({
        where: {
          AND: [
            { id: { not: userId } },
            {
              OR: [
                ...(username ? [{ username }] : []),
                ...(email ? [{ email }] : []),
                ...(phone ? [{ phone }] : []),
              ],
            },
          ],
        },
      })

      if (existingUser) {
        let message = '信息已被使用'
        if (username && existingUser.username === username) message = '用户名已被使用'
        else if (email && existingUser.email === email) message = '邮箱已被注册'
        else if (phone && existingUser.phone === phone) message = '手机号已被注册'
        
        return res.status(409).json({
          success: false,
          message,
        })
      }

      const updateData: any = {}
      if (username !== undefined) updateData.username = username
      if (email !== undefined) {
        updateData.email = email
        updateData.isVerified = false // 修改邮箱后需要重新验证
      }
      if (phone !== undefined) {
        updateData.phone = phone
        updateData.phoneVerifiedAt = null // 修改手机后需要重新验证
      }

      const user = await prisma.user.update({
        where: { id: userId },
        data: updateData,
        select: {
          id: true,
          username: true,
          email: true,
          phone: true,
          isVerified: true,
          emailVerifiedAt: true,
          phoneVerifiedAt: true,
          updatedAt: true,
        },
      })

      logger.info(`User profile updated: ${user.username} (${user.id})`)

      res.json({
        success: true,
        data: user,
        message: '用户信息更新成功',
      })
    } catch (error) {
      logger.error('Update profile error:', error)
      res.status(500).json({
        success: false,
        message: '更新用户信息失败',
      })
    }
  }

  /**
   * 修改密码
   */
  async changePassword(req: Request, res: Response) {
    try {
      const userId = req.user!.userId
      const { oldPassword, newPassword } = req.body

      // 获取用户信息
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { passwordHash: true },
      })

      if (!user) {
        return res.status(404).json({
          success: false,
          message: '用户不存在',
        })
      }

      // 验证旧密码
      const isOldPasswordValid = await bcrypt.compare(oldPassword, user.passwordHash)
      if (!isOldPasswordValid) {
        logSecurityEvent('change_password_failed_invalid_old', { userId })
        return res.status(400).json({
          success: false,
          message: '旧密码不正确',
        })
      }

      // 哈希新密码
      const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || '12')
      const newPasswordHash = await bcrypt.hash(newPassword, saltRounds)

      // 更新密码
      await prisma.user.update({
        where: { id: userId },
        data: { passwordHash: newPasswordHash },
      })

      logger.info(`Password changed: ${userId}`)

      res.json({
        success: true,
        message: '密码修改成功',
      })
    } catch (error) {
      logger.error('Change password error:', error)
      res.status(500).json({
        success: false,
        message: '修改密码失败',
      })
    }
  }

  /**
   * 发送验证码
   */
  async sendVerificationCode(req: Request, res: Response) {
    try {
      const { phone, type } = req.body

      // 检查手机号
      if (type === 'register') {
        const existingUser = await prisma.user.findFirst({
          where: { phone },
        })
        if (existingUser) {
          return res.status(409).json({
            success: false,
            message: '手机号已被注册',
          })
        }
      }

      // 生成验证码
      const code = generateRandomCode(6)

      // 发送短信
      const smsResult = await sendSMS(phone, code)
      if (!smsResult.success) {
        return res.status(500).json({
          success: false,
          message: '发送验证码失败',
        })
      }

      // 如果是注册流程，更新用户信息
      if (type === 'register') {
        await prisma.user.updateMany({
          where: { phone },
          data: {
            verificationCode: code,
            codeExpiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10分钟
          },
        })
      }

      logger.info(`Verification code sent to ${phone}`)

      res.json({
        success: true,
        message: '验证码已发送',
      })
    } catch (error) {
      logger.error('Send verification code error:', error)
      res.status(500).json({
        success: false,
        message: '发送验证码失败',
      })
    }
  }

  /**
   * 重置密码
   */
  async resetPassword(req: Request, res: Response) {
    try {
      const { phone, code, newPassword } = req.body

      // 查找用户
      const user = await prisma.user.findFirst({
        where: { phone },
      })

      if (!user) {
        return res.status(404).json({
          success: false,
          message: '用户不存在',
        })
      }

      // 验证验证码
      if (user.verificationCode !== code || !user.codeExpiresAt || user.codeExpiresAt < new Date()) {
        return res.status(400).json({
          success: false,
          message: '验证码无效或已过期',
        })
      }

      // 哈希新密码
      const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || '12')
      const newPasswordHash = await bcrypt.hash(newPassword, saltRounds)

      // 更新密码
      await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash: newPasswordHash,
          verificationCode: null,
          codeExpiresAt: null,
        },
      })

      logger.info(`Password reset: ${user.username} (${user.id})`)

      res.json({
        success: true,
        message: '密码重置成功',
      })
    } catch (error) {
      logger.error('Reset password error:', error)
      res.status(500).json({
        success: false,
        message: '密码重置失败',
      })
    }
  }

  /**
   * 验证邮箱
   */
  async verifyEmail(req: Request, res: Response) {
    try {
      const userId = req.user!.userId
      const { code } = req.body

      const user = await prisma.user.findUnique({
        where: { id: userId },
      })

      if (!user) {
        return res.status(404).json({
          success: false,
          message: '用户不存在',
        })
      }

      if (user.isVerified) {
        return res.json({
          success: true,
          message: '邮箱已验证',
        })
      }

      if (user.verificationCode !== code) {
        return res.status(400).json({
          success: false,
          message: '验证码不正确',
        })
      }

      await prisma.user.update({
        where: { id: userId },
        data: {
          isVerified: true,
          emailVerifiedAt: new Date(),
          verificationCode: null,
          codeExpiresAt: null,
        },
      })

      logger.info(`Email verified: ${user.username} (${user.id})`)

      res.json({
        success: true,
        message: '邮箱验证成功',
      })
    } catch (error) {
      logger.error('Verify email error:', error)
      res.status(500).json({
        success: false,
        message: '邮箱验证失败',
      })
    }
  }

  /**
   * 验证手机号
   */
  async verifyPhone(req: Request, res: Response) {
    try {
      const userId = req.user!.userId
      const { code } = req.body

      const user = await prisma.user.findUnique({
        where: { id: userId },
      })

      if (!user) {
        return res.status(404).json({
          success: false,
          message: '用户不存在',
        })
      }

      if (user.phoneVerifiedAt) {
        return res.json({
          success: true,
          message: '手机号已验证',
        })
      }

      if (user.verificationCode !== code) {
        return res.status(400).json({
          success: false,
          message: '验证码不正确',
        })
      }

      await prisma.user.update({
        where: { id: userId },
        data: {
          phoneVerifiedAt: new Date(),
          verificationCode: null,
          codeExpiresAt: null,
        },
      })

      logger.info(`Phone verified: ${user.username} (${user.id})`)

      res.json({
        success: true,
        message: '手机号验证成功',
      })
    } catch (error) {
      logger.error('Verify phone error:', error)
      res.status(500).json({
        success: false,
        message: '手机号验证失败',
      })
    }
  }
}
