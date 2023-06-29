'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var DocUtils = require('docxtemplater').DocUtils;

var rels = {
    getPrefix: function getPrefix(fileType) {
        return fileType === 'docx' ? 'word' : 'ppt';
    },
    getFileTypeName: function getFileTypeName(fileType) {
        return fileType === 'docx' ? 'document' : 'presentation';
    },
    getRelsFileName: function getRelsFileName(fileName) {
        return fileName.replace(/^.*?([a-zA-Z0-9]+)\.xml$/, '$1') + '.xml.rels';
    },
    getRelsFilePath: function getRelsFilePath(fileName, fileType) {
        var relsFileName = rels.getRelsFileName(fileName);
        var prefix = fileType === 'pptx' ? 'ppt/slides' : 'word';
        return prefix + '/_rels/' + relsFileName;
    }
};

module.exports = function () {
    function LinkManager(zip, fileName, xmlDocuments, fileType) {
        _classCallCheck(this, LinkManager);

        this.nbLinks = 1;
        this.fileName = fileName;
        this.prefix = rels.getPrefix(fileType);
        this.zip = zip;
        this.xmlDocuments = xmlDocuments;
        this.fileTypeName = rels.getFileTypeName(fileType);
        var relsFilePath = rels.getRelsFilePath(fileName, fileType);
        this.relsDoc = xmlDocuments[relsFilePath] || this.createEmptyRelsDoc(xmlDocuments, relsFilePath);
    }

    _createClass(LinkManager, [{
        key: 'createEmptyRelsDoc',
        value: function createEmptyRelsDoc(xmlDocuments, relsFileName) {
            var mainRels = this.prefix + '/_rels/' + this.fileTypeName + '.xml.rels';
            var doc = xmlDocuments[mainRels];
            if (!doc) {
                var err = new Error('Could not copy from empty relsdoc');
                err.properties = {
                    mainRels: mainRels,
                    relsFileName: relsFileName,
                    files: Object.keys(this.zip.files)
                };
                throw err;
            }
            var relsDoc = DocUtils.str2xml(DocUtils.xml2str(doc));
            var relationships = relsDoc.getElementsByTagName('Relationships')[0];
            var relationshipChilds = relationships.getElementsByTagName('Relationship');
            for (var i = 0, l = relationshipChilds.length; i < l; i++) {
                relationships.removeChild(relationshipChilds[i]);
            }
            xmlDocuments[relsFileName] = relsDoc;
            return relsDoc;
        }
    }, {
        key: 'loadLinkRels',
        value: function loadLinkRels() {
            var iterable = this.relsDoc.getElementsByTagName('Relationship');
            return Array.prototype.reduce.call(iterable, function (max, relationship) {
                var id = relationship.getAttribute('Id');
                if (/^rId[0-9]+$/.test(id)) {
                    return Math.max(max, parseInt(id.substr(3), 10));
                }
                return max;
            }, 0);
        }
    }, {
        key: 'addLinkRels',
        value: function addLinkRels(linkObject, linkIteration) {
            var relationships = this.relsDoc.getElementsByTagName('Relationships')[0];
            var relationshipChilds = relationships.getElementsByTagName('Relationship');

            var newTag = this.relsDoc.createElement('Relationship');
            newTag.namespaceURI = null;

            var styleXml = this.xmlDocuments["word/styles.xml"];
            var styles = styleXml.getElementsByTagName("w:styles")[0];
            var textProperties = linkObject.properties;
            var newStyleStr = '<w:style w:type="character" w:styleId="InternetLink-' + linkIteration + '"><w:name w:val="Hyperlink"/><w:rPr><w:uiPriority w:val="99"/><w:unhideWhenUsed/><w:color w:val="' + textProperties.color + '"/><w:u w:val="single"/><w:lang w:val="zxx" w:eastAsia="zxx" w:bidi="zxx"/></w:rPr></w:style>';
            var newStyleXml = DocUtils.str2xml(newStyleStr);
            styles.appendChild(newStyleXml);

            var rId = 'rId' + (relationshipChilds.length + 1);
            newTag.setAttribute('Id', rId);
            newTag.setAttribute('Type', 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink');
            newTag.setAttribute('Target', decodeURIComponent(linkObject.url));
            newTag.setAttribute('TargetMode', 'External');
            relationships.appendChild(newTag);
            return rId;
        }
    }, {
        key: 'generateHyperLink',
        value: function generateHyperLink(linkObject, rId, linkIteration) {
            var textProperties = linkObject.properties;
            var textStylesTags = '';

            Object.keys(textProperties).forEach(function (property) {
                if (property === 'color') {
                    textStylesTags += '<w:color w:val="' + textProperties[property] + '"/>';
                } else if (property === 'fontSize') {
                    textStylesTags += '<w:sz w:val="' + textProperties[property] + '" />';
                } else if (property === 'bold') {
                    textStylesTags += '<w:b w:val="' + textProperties[property] + '" />';
                }
            });

            return '</w:t></w:r><w:hyperlink r:id="' + rId + '"><w:r><w:rPr><w:rStyle w:val="InternetLink-' + linkIteration + '"/>' + textStylesTags + '</w:rPr><w:t>' + linkObject.text + '</w:t></w:r></w:hyperlink><w:r><w:t xml:space="preserve">';
        }
    }]);

    return LinkManager;
}();