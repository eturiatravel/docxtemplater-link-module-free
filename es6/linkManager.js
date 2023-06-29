'use strict';

const DocUtils = require('docxtemplater').DocUtils;

const rels = {
    getPrefix(fileType) {
        return fileType === 'docx' ? 'word' : 'ppt';
    },
    getFileTypeName(fileType) {
        return fileType === 'docx' ? 'document' : 'presentation';
    },
    getRelsFileName(fileName) {
        return fileName.replace(/^.*?([a-zA-Z0-9]+)\.xml$/, '$1') + '.xml.rels';
    },
    getRelsFilePath(fileName, fileType) {
        const relsFileName = rels.getRelsFileName(fileName);
        const prefix = fileType === 'pptx' ? 'ppt/slides' : 'word';
        return `${prefix}/_rels/${relsFileName}`;
    },
};

module.exports = class LinkManager {
    constructor(zip, fileName, xmlDocuments, fileType) {
        this.nbLinks = 1;
        this.fileName = fileName;
        this.prefix = rels.getPrefix(fileType);
        this.zip = zip;
        this.xmlDocuments = xmlDocuments;
        this.fileTypeName = rels.getFileTypeName(fileType);
        const relsFilePath = rels.getRelsFilePath(fileName, fileType);
        this.relsDoc = xmlDocuments[relsFilePath] || this.createEmptyRelsDoc(xmlDocuments, relsFilePath);
    }

    createEmptyRelsDoc(xmlDocuments, relsFileName) {
        const mainRels = this.prefix + '/_rels/' + this.fileTypeName + '.xml.rels';
        const doc = xmlDocuments[mainRels];
        if (!doc) {
            const err = new Error('Could not copy from empty relsdoc');
            err.properties = {
                mainRels,
                relsFileName,
                files: Object.keys(this.zip.files),
            };
            throw err;
        }
        const relsDoc = DocUtils.str2xml(DocUtils.xml2str(doc));
        const relationships = relsDoc.getElementsByTagName('Relationships')[0];
        const relationshipChilds = relationships.getElementsByTagName('Relationship');
        for (let i = 0, l = relationshipChilds.length; i < l; i++) {
            relationships.removeChild(relationshipChilds[i]);
        }
        xmlDocuments[relsFileName] = relsDoc;
        return relsDoc;
    }

    loadLinkRels() {
        const iterable = this.relsDoc.getElementsByTagName('Relationship');
        return Array.prototype.reduce.call(
            iterable,
            function (max, relationship) {
                const id = relationship.getAttribute('Id');
                if (/^rId[0-9]+$/.test(id)) {
                    return Math.max(max, parseInt(id.substr(3), 10));
                }
                return max;
            },
            0,
        );
    }

    addLinkRels(linkObject, linkIteration) {
        const relationships = this.relsDoc.getElementsByTagName('Relationships')[0];
        const relationshipChilds = relationships.getElementsByTagName('Relationship');

        const newTag = this.relsDoc.createElement('Relationship');
        newTag.namespaceURI = null;

        const styleXml = this.xmlDocuments["word/styles.xml"];
        const styles = styleXml.getElementsByTagName("w:styles")[0];
        const textProperties = linkObject.properties;
        const newStyleStr = `<w:style w:type="character" w:styleId="InternetLink-${linkIteration}"><w:name w:val="Hyperlink"/><w:rPr><w:uiPriority w:val="99"/><w:unhideWhenUsed/><w:color w:val="${textProperties.color}"/><w:u w:val="single"/><w:lang w:val="zxx" w:eastAsia="zxx" w:bidi="zxx"/></w:rPr></w:style>`;
        const newStyleXml = DocUtils.str2xml(newStyleStr);
        styles.appendChild(newStyleXml);

        const rId = `rId${relationshipChilds.length + 1}`;
        newTag.setAttribute('Id', rId);
        newTag.setAttribute('Type', 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink');
        newTag.setAttribute('Target', decodeURIComponent(linkObject.url));
        newTag.setAttribute('TargetMode', 'External');
        relationships.appendChild(newTag);
        return rId;
    }

    generateHyperLink(linkObject, rId, linkIteration) {
        const textProperties = linkObject.properties;
        let textStylesTags = '';

        Object.keys(textProperties).forEach((property) => {
            if (property === 'color') {
                textStylesTags += `<w:color w:val="${textProperties[property]}"/>`;
            } else if (property === 'fontSize') {
                textStylesTags += `<w:sz w:val="${textProperties[property]}" />`;
            } else if (property === 'bold') {
                textStylesTags += `<w:b w:val="${textProperties[property]}" />`;
            }
        });

        return `</w:t></w:r><w:hyperlink r:id="${rId}"><w:r><w:rPr><w:rStyle w:val="InternetLink-${linkIteration}"/>${textStylesTags}</w:rPr><w:t>${linkObject.text}</w:t></w:r></w:hyperlink><w:r><w:t xml:space="preserve">`;
    }
};
