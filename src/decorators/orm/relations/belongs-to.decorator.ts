import { Prop } from '../prop.decorator';

export type BelongsToMetadata = {
   columnName?: string,
   
   foreignKey?: string,
   foreignTableName?: string
};

export function BelongsTo(meta?: BelongsToMetadata) {
   throw new Error(`Not implemented!`);
}
