import express from 'express'
import { body, validationResult } from 'express-validator'
import { AuthController } from '../controllers/AuthController'
import { authMiddleware } from '../middleware/auth'

const router = express.Router()
const authController = new AuthController()

// 登录验证规则
const loginValidation = [
  body('login')
    .notEmpty()
    .withMessage('登录名不能为空')
    .isLength({ min: 3, max: 100 })
    .withMessage('登录名长度必须在3-100字符之间'),
  body('password')
    .notEmpty()
    .withMessage('密码不能为空')
    .isLength({ min: 6, max: 128 })
    .withMessage('密码长度必须在6-128字符之间'),
]

// 注册验证规则
const registerValidation = [
  body('username')
    .notEmpty()
    .withMessage('用户名不能为空')
    .isLength({ min: 3, max: 50 })
    .withMessage('用户名长度必须在3-50字符之间')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('用户名只能包含字母、数字和下划线'),
  body('email')
    .notEmpty()
    .withMessage('邮箱不能为空')
    .isEmail()
    .withMessage('请输入有效的邮箱地址')
    .normalizeEmail(),
  body('phone')
    .optional()
    .matches(/^1[3-9]\d{9}$/)
    .withMessage('请输入有效的手机号码'),
  body('password')
    .notEmpty()
    .withMessage('密码不能为空')
    .isLength({ min: 8, max: 128 })
    .withMessage('密码长度必须在8-128字符之间')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('密码必须包含大小写字母、数字和特殊字符'),
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('两次输入的密码不一致')
      }
      return true
    }),
]

// 修改密码验证规则
const changePasswordValidation = [
  body('oldPassword')
    .notEmpty()
    .withMessage('旧密码不能为空'),
  body('newPassword')
    .notEmpty()
    .withMessage('新密码不能为空')
    .isLength({ min: 8, max: 128 })
    .withMessage('新密码长度必须在8-128字符之间')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('新密码必须包含大小写字母、数字和特殊字符'),
]

// 发送验证码验证规则
const sendCodeValidation = [
  body('phone')
    .notEmpty()
    .withMessage('手机号不能为空')
    .matches(/^1[3-9]\d{9}$/)
    .withMessage('请输入有效的手机号码'),
  body('type')
    .isIn(['register', 'reset-password'])
    .withMessage('验证码类型无效'),
]

// 重置密码验证规则
const resetPasswordValidation = [
  body('phone')
    .notEmpty()
    .withMessage('手机号不能为空')
    .matches(/^1[3-9]\d{9}$/)
    .withMessage('请输入有效的手机号码'),
  body('code')
    .notEmpty()
    .withMessage('验证码不能为空')
    .isLength({ min: 6, max: 6 })
    .withMessage('验证码必须为6位数字'),
  body('newPassword')
    .notEmpty()
    .withMessage('新密码不能为空')
    .isLength({ min: 8, max: 128 })
    .withMessage('新密码长度必须在8-128字符之间')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('新密码必须包含大小写字母、数字和特殊字符'),
]

// 验证结果处理中间件
const handleValidationErrors = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: '验证失败',
      errors: errors.array(),
    })
  }
  next()
}

// 路由定义

// 用户认证相关
router.post('/register', registerValidation, handleValidationErrors, authController.register)
router.post('/login', loginValidation, handleValidationErrors, authController.login)
router.post('/logout', authMiddleware, authController.logout)
router.post('/refresh', authController.refreshToken)

// 用户信息相关
router.get('/profile', authMiddleware, authController.getProfile)
router.put('/profile', authMiddleware, authController.updateProfile)

// 密码相关
router.post('/change-password', authMiddleware, changePasswordValidation, handleValidationErrors, authController.changePassword)
router.post('/send-code', sendCodeValidation, handleValidationErrors, authController.sendVerificationCode)
router.post('/reset-password', resetPasswordValidation, handleValidationErrors, authController.resetPassword)

// 验证相关
router.post('/verify-email', authMiddleware, authController.verifyEmail)
router.post('/verify-phone', authMiddleware, authController.verifyPhone)

export default router
