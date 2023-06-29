'use strict';

const LinkManager = require('./linkManager');
const wrapper = require('docxtemplater/js/module-wrapper');

const moduleName = 'linkmodule';

class LinkModule {
    constructor() {
        this.name = 'LinkModule';
        this.prefix = '$';
        this.linkIteration = 0;
    }

    optionsTransformer(options, docxtemplater) {
        const relsFiles = docxtemplater.zip
            .file(/\.xml\.rels/)
            .concat(docxtemplater.zip.file(/\[Content_Types\].xml/), docxtemplater.zip.file(/styles\.xml/))
            .map((file) => file.name);
        this.fileTypeConfig = docxtemplater.fileTypeConfig;
        this.fileType = docxtemplater.fileType;
        this.zip = docxtemplater.zip;
        options.xmlFileNames = options.xmlFileNames.concat(relsFiles);
        return options;
    }

    set(obj) {
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

    matchers() {
        return [[this.prefix, moduleName]];
    }

    getRenderedMap(mapper) {
        return Object.keys(this.compiled).reduce((mapper, from) => {
            mapper[from] = {from, data: this.data};
            return mapper;
        }, mapper);
    }

    render(part, {scopeManager, filePath}) {
        if (part.module !== moduleName) {
            return null;
        }

        const linkManager = new LinkManager(this.zip, filePath, this.xmlDocuments, this.fileType);
        const tagValue = scopeManager.getValue(part.value, {part});

        if (!tagValue.properties && !tagValue.url && !tagValue.text) {
            return {value: this.fileTypeConfig.tagTextXml};
        }
        const rId = linkManager.addLinkRels(tagValue, this.linkIteration);
        const textProperties = tagValue.properties;

        const value = linkManager.generateHyperLink(tagValue, rId, this.linkIteration);
        this.linkIteration += 1;

        return {value};
    }
}

module.exports = () => wrapper(new LinkModule());
