import * as _ from 'lodash';

let LZString = require('lz-string');

let compress = function (data: any) {
  return LZString.compressToUTF16(JSON.stringify(data));
};

let decompress = function (val: any) {
  if (!val || !val.compressed) return val;

  let decompressed: any, res: any;
  if (val.compressed) {
    decompressed = JSON.parse(LZString.decompressFromUTF16(val.compressed));
  }


  if (_.isObject(decompressed) && !_.isArray(decompressed)) {
    res = _.extend({}, val, decompressed);
    delete res.compressed;
  } else {
    res = decompressed;
  }

  return res;
};

export = {
  compress: compress,
  decompress: decompress
};
