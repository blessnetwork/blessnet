const createWasmManifest = (entry, contentType, manifestOverride = {}) => {
    const name = entry.split(".")[0];

    const manifest = {
        id: "",
        version: 1,
        name,
        hooks: [],
        description: "",
        fs_root_path: "./",
        drivers_root_path: "./",
        runtime_logger: 'runtime.log',
        entry: '_start',
        contentType: contentType || 'text',
        modules: [],
        permissions: [],
        ...manifestOverride
    };

    return manifest;
};

module.exports = {
    createWasmManifest
};
