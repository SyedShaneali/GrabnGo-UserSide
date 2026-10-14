// Drops empty values so we never send ?search=&from_country_id=&status= etc.
// `false` and `0` are kept on purpose — they're valid filter values.
export const cleanParams = (params = {}) =>
  Object.fromEntries(
    Object.entries(params).filter(([, value]) => {
      if (value === undefined || value === null || value === "") return false;
      if (Array.isArray(value) && value.length === 0) return false;
      return true;
    })
  );

// FastAPI expects repeated keys for arrays: ?status=OPEN&status=CLOSED
// (axios v1 default would send status[]=OPEN&status[]=CLOSED)
export const PARAMS_SERIALIZER = { indexes: null };