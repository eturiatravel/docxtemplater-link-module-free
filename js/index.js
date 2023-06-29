'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var LinkManager = require('./linkManager');
var wrapper = require('docxtemplater/js/module-wrapper');

var moduleName = 'linkmodule';

var LinkModule = function () {
    function LinkModule() {
        _classCallCheck(this, LinkModule);

        this.name = 'LinkModule';
        this.prefix = '$';
        this.linkIteration = 0;
    }

    _createClass(LinkModule, [{
        key: 'optionsTransformer',
        value: function optionsTransformer(options, docxtemplater) {
            var relsFiles = docxtemplater.zip.file(/\.xml\.rels/).concat(docxtemplater.zip.file(/\[Content_Types\].xml/), docxtemplater.zip.file(/styles\.xml/)).map(function (file) {
                return file.name;
            });
            this.fileTypeConfig = docxtemplater.fileTypeConfig;
            this.fileType = docxtemplater.fileType;
            this.zip = docxtemplater.zip;
            options.xmlFileNames = options.xmlFileNames.concat(relsFiles);
            return options;
        }
    }, {
        key: 'set',
        value: function set(obj) {
            if (obj.zip) {
                this.zip = obj.zip;
            }
            if (obj.compiled) {
                this.compiled = obj.compiled;
            }
            if (obj.xmlDocuments) {
                this.xmlDocuments = obj.xmlDocuments;
            }
            if (obj.data != null) {
                this.data = obj.data;
            }
        }
    }, {
        key: 'matchers',
        value: function matchers() {
            return [[this.prefix, moduleName]];
        }
    }, {
        key: 'getRenderedMap',
        value: function getRenderedMap(mapper) {
            var _this = this;

            return Object.keys(this.compiled).reduce(function (mapper, from) {
                mapper[from] = { from: from, data: _this.data };
                return mapper;
            }, mapper);
        }
    }, {
        key: 'render',
        value: function render(part, _ref) {
            var scopeManager = _ref.scopeManager,
                filePath = _ref.filePath;

            if (part.module !== moduleName) {
                return null;
            }

            var linkManager = new LinkManager(this.zip, filePath, this.xmlDocuments, this.fileType);
            var tagValue = scopeManager.getValue(part.value, { part: part });

            if (!tagValue.properties && !tagValue.url && !tagValue.text) {
                return { value: this.fileTypeConfig.tagTextXml };
            }
            var rId = linkManager.addLinkRels(tagValue, this.linkIteration);
            var textProperties = tagValue.properties;

            var value = linkManager.generateHyperLink(tagValue, rId, this.linkIteration);
            this.linkIteration += 1;

            return { value: value };
        }
    }]);

    return LinkModule;
}();

module.exports = function () {
    return wrapper(new LinkModule());
};