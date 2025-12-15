import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { ROLES_KEY } from './roles.decorator';
import { IS_PUBLIC_KEY } from './public.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector, private jwtService: JwtService) { }
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    // Public Routes
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;
    // Protected Routes
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    // Authorization 
    const authHeader = request.headers['authorization'];
    if (!authHeader) throw new UnauthorizedException('Missing Authorization header');
    const token = authHeader.split(' ')[1];
    if (!token) throw new UnauthorizedException('Invalid Authorization header format');
    let decoded: any;
    try {
      decoded = this.jwtService.verify(token);
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token');
    }
    request.user = decoded;
    // Admin Role
    if (decoded.role === 'admin') return true;
    // Check role-based access
    if (requiredRoles && !requiredRoles.includes(decoded.role)) {
      throw new ForbiddenException('Access denied: insufficient role');
    }
    // Author or Reader Role
    if (
      (decoded.role === 'author' || decoded.role === 'reader') &&
      request.params?.id &&
      parseInt(request.params.id) !== decoded.id
    ) {
      throw new ForbiddenException('You can only access your own data');
    }
    return true;
  }
}
