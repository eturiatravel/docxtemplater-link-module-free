declare class LinkModule {
  constructor();

  optionsTransformer(options: any, docxtemplater: any): void;
  set(obj: any): void;
  matchers(): any[];
  getRenderedMap(): any
  render(): any
}

export default LinkModule;