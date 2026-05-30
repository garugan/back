export class RegisterDto {
  email!: string;
  password!: string;
  name?: string;
  recaptchaToken?: string;
}
