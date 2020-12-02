# Changelog

All notable changes to the "vscode-sosml" extension will be documented in this file.

## [1.3.0] - 12/03/2020

### Added

- Basic support for user curated functions is now available! Open up the Settings with CTRL+, , search for "sosml" and enter functions into the Setting 'SOSML: Preloaded User Functions'. This is highly experimental and the feature will be refined in future versions. For now it is best not to enter any functions unless they have been tested to work in an interpreter window. Make sure they run well and perform their function properly before entering them here.

### Fixed

- Some users had problems with the formatting functions used in the webview. This has been adressed. Thanks @MushroomMaula
- Some users ran into trouble when using CRLF file endings (default on Windows). This has also been adressed. Thanks again @MushroomMaula
- The snippets had some difficulty determining where the cursor should start its journey and where it should end it. Not anymore though.

## [1.2.0] - 11/10/2020

### Added

- The first batch of snippets has arrived. These make it easier to access function available at the top level of the interpreter like Real.fromInt or others. They each have the function signature, a description of what the function does and at least one example. Currently implemented are:
    - declaration of an anonymous functions
    - Type declaration of a function 
    - String library ( ^, concat, explode, implode, size, str, substring )
    - Real library ( ceil, floor, fromInt, round, trunc, div )
    - List library ( @, app, foldl, foldr, hd, length, map, null, rev, tl ) (more to come here, specifically the additional functions implented in [SOSML - list lib](https://github.com/SOSML/SOSML/blob/master/src/stdlib/list.ts))
    - 
- Finally, a logo has been added to the extension

## [1.1.1] - 11/9/2020

### Fixed

- It was previously possible to open two interpreter windows leading to hijinx involving mixed up files. Such malarky is now avoided.

## [1.1.0] - 11/8/2020

### Added

- Multiple programs within a file are now treated as such
- Every program gets a background color out of a set of five (deepskyblue, lawngreen, teal, yellowgreen, darkviolet) to make it easily distinguishable from the others
- Errors are are written in red on a black background for maximum errorness

### Fixed

- Comments used to create evaluation errors. This is not the case any more!

## [1.0.0] - 11/7/2020

- Initial release
