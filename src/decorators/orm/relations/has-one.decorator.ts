import { Prop } from '../prop.decorator';

export type HasOneMetadata = {
   columnName?: string,
   
   foreignKey?: string,
   foreignTableName?: string
};

export function HasOne(meta?: HasOneMetadata) {
   throw new Error(`Not implemented!`);
}
