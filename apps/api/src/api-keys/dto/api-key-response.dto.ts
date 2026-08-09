export class ApiKeyResponseDto {
  id: string;
  name: string | null;
  provider: string;
  keyMasked: string;
  createdAt: Date;
  updatedAt: Date;
}
