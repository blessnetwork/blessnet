# blessnet

Build distributed, scalable, edge based applications fast.

## getting started

Make sure you have `npm` installed. We recommend a `version 18+` the fastest way to getting started with npm is installing it into your system using `nvm`.

* <https://github.com/nvm-sh/nvm?tab=readme-ov-file#installing-and-updating>

Where ever you are, run `npx blessnet` to get context feedback. If calling from inside a project folder, information about the state of the project will be returned.

Otherwise the guided initializer will be called.

`npx blessnet help` will always provide more information.

### quick start

```bash
npx blessnet
```

* First launch you will be asked to install the `BLESS Runtime`.

```bash
➜ npx blessnet
BLESS environment not found. Do you want to install it? (yes/no): y
✔ Installation successful.
BLESS environment installed successfully.
You can now use the `blessnet` command.
```

## details

Create a new project with the name `foo`, the project will have a folder created called `foo`

```bash
npx blessnet init foo
cd foo
```

### project structure

```text
.
├── bls.toml              # project config
├── index.ts              # entry
├── package.json          # javascript packages
├── tsconfig.base.json    # typescript configs
├── tsconfig.debug.json   # typescript configs
└── tsconfig.release.json # typescript configs
```

### deploy

To deploy the application, cd into the directory and run

```bash
npx blessnet deploy
```

### deploy keys

**WARN**

## other things

Install `blessnet` globally for use without npx.

```bash
npm i -g blessnet
```

```bash
npx blessnet wallet list
```
