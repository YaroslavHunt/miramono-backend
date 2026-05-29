import { Transform } from 'class-transformer';

export const ToOptionalBoolean = () =>
  Transform(({ value }) => {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }
    if (typeof value === 'boolean') {
      return value;
    }
    return ['true', '1', 'yes'].includes(String(value).toLowerCase());
  });
