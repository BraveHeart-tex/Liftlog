// Jest has no Nitro native binary. Libraries that import Nitro eagerly but switch to
// their own test implementation under Jest (react-native-mmkv) only need it to load.
export const NitroModules = {
  createHybridObject(name: string): never {
    throw new Error(`Nitro hybrid object ${name} is not available under Jest.`);
  }
};
