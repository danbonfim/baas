import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common'

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest()
    if (request.user?.role !== 'ADMIN') {
      throw new ForbiddenException('Acesso restrito a administradores')
    }
    return true
  }
}
