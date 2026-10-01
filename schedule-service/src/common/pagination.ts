import type { Type } from '@nestjs/common';
import { ArgsType, Field, Int, ObjectType } from '@nestjs/graphql';
import { IsInt, Max, Min } from 'class-validator';

@ArgsType()
export class PaginationArgs {
    @Field(() => Int, { defaultValue: 1, description: 'Page number, starting at 1' })
    @IsInt()
    @Min(1)
    page: number = 1;

    @Field(() => Int, { defaultValue: 10, description: 'Items per page (max 100)' })
    @IsInt()
    @Min(1)
    @Max(100)
    limit: number = 10;
}

@ObjectType({ description: 'Pagination metadata' })
export class PageInfo {
    @Field(() => Int) total!: number;
    @Field(() => Int) page!: number;
    @Field(() => Int) limit!: number;
    @Field(() => Int) totalPages!: number;
    @Field() hasNextPage!: boolean;
}

export interface PaginatedResult<T> {
    items: T[];
    pageInfo: PageInfo;
}

export function Paginated<T>(classRef: Type<T>): Type<PaginatedResult<T>> {
    @ObjectType({ isAbstract: true })
    abstract class PaginatedType implements PaginatedResult<T> {
        @Field(() => [classRef]) items!: T[];
        @Field(() => PageInfo) pageInfo!: PageInfo;
    }
    return PaginatedType as Type<PaginatedResult<T>>;
}

export const toSkipTake = ({ page, limit }: PaginationArgs) => ({
    skip: (page - 1) * limit,
    take: limit,
});

export function buildPageInfo(total: number, page: number, limit: number): PageInfo {
    const totalPages = Math.ceil(total / limit);
    return { total, page, limit, totalPages, hasNextPage: page < totalPages };
}