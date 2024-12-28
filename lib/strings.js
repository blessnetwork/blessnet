const { uniqueNamesGenerator, adjectives, colors, animals } = require("unique-names-generator");

const randomName = () => {
    return uniqueNamesGenerator({
        dictionaries: [adjectives, colors, animals],
        separator: '-'
    });
};

const sanitizer = /[^a-zA-Z0-9\-]/;
const sanitize = (input) => input.replace(sanitizer, "");

const slugify = (...args) => {
    const value = args.join(' ');

    return value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9 _.-]/g, '')
        .replace(/_/g, '-')
        .replace(/\s+/g, '-');
};

const normalizeFunctionName = (name) => {
    let formattedName = name;

    if (formattedName) {
        formattedName = formattedName.trim();
        formattedName = formattedName.replace(/_/g, '-');
        formattedName = formattedName.replace(/ /g, '-');
    }

    return formattedName;
};

module.exports = { randomName, sanitize, slugify, normalizeFunctionName };
