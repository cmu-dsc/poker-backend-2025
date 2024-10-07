resource "aws_sns_topic" "sns_topic" {
  name      = "match-result-topic.fifo"
  fifo_topic = true
}

# TODO: add a subscription for the backend to this topic.