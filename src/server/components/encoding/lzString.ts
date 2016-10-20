var _ = require('lodash'),
  LZString = require('lz-string');

var compress = function (data: any) {
  return LZString.compressToUTF16(JSON.stringify(data));
};

var decompress = function (val: any) {
  if (!val || !val.compressed) return val;

  var decompressed: any, res: any;
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

module.exports = {
  compress: compress,
  decompress: decompress
};
