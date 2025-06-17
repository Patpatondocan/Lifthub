module.exports = {
  // This function determines whether a source map URL should be processed
  filterSourceMappingUrl: function (url, resourcePath) {
    // Ignore source maps for the html5-qrcode package
    if (resourcePath.includes("html5-qrcode")) {
      return false;
    }
    return true;
  },
};
