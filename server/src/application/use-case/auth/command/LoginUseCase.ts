import { LoginResponseDto, loginRequestSchema } from "../../../dto/auth/LoginDto";
import { AuthService } from "../../../service/AuthService";


export class LoginUseCase {
  constructor(private readonly authService: AuthService) { }

  async execute(input: unknown): Promise<LoginResponseDto> {
    const dto = loginRequestSchema.parse(input);
    return this.authService.login(dto.username, dto.password);
  }
}
