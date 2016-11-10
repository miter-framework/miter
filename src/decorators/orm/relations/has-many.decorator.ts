import { Prop } from '../prop.decorator';

export type HasManyMetadata = {
   foreignKey?: string,
   foreignTableName?: string
};

export function HasMany(meta?: HasManyMetadata) {
   throw new Error(`Not implemented!`);
}
