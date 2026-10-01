import { ConflictException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

export function rethrowPrismaError(error: unknown, entity: string): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        switch (error.code) {
            case 'P2002':
                throw new ConflictException(`${entity} violates a unique constraint`);
            case 'P2003':
                throw new ConflictException(`${entity} references a missing or still-referenced record`);
            case 'P2025':
                throw new NotFoundException(`${entity} not found`);
        }
    }
    throw error;
}