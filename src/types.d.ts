// Type declarations for modules without TypeScript definitions
declare module 'lodash.isequal' {
  function isEqual(value: any, other: any): boolean;
  export = isEqual;
}