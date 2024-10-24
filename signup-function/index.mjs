export function handler (event, context, callback) {
  const { email } = event.request.userAttributes;

  if (email.endsWith('.edu') || event.triggerSource === 'PreSignUp_ExternalProvider') {
    callback(null, event);
  } else {
    callback(new Error('Invalid email domain. Please use a .edu email address.'));
  }
}