declare type TODO = any;

/** Represents basic object type with typed values */
declare type Obj<ValueT = any> = Record<string, ValueT>;
/** An empty object with no keys. Using {} means any non-nullish value, not an object with no keys */
declare type EmptyObj = Obj<never>;
