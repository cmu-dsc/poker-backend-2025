resource "aws_lambda_function" "pre_sign_up" {
  filename      = "${path.module}/signup-function.zip"
  function_name = "cognito_pre_sign_up"
  role          = aws_iam_role.pre_sign_up_lambda_role.arn
  handler       = "index.handler"
  runtime       = "nodejs20.x"

  source_code_hash = filebase64sha256("${path.module}/signup-function.zip")

  tags = var.tags
}

resource "aws_lambda_permission" "allow_cognito" {
  statement_id  = "AllowCognitoInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.pre_sign_up.function_name
  principal     = "cognito-idp.amazonaws.com"
  source_arn    = aws_cognito_user_pool.main.arn
}
