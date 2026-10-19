# Hebrew Bible · Ledger Reader

Open this page through the existing For Everyone GitHub Pages site. It checks the exact retained reader carrier identity before reading any verse. Hebrew remains unchanged; English WEB is a reference translation, not a newly generated result.

## Translate from a selected template

1. Select a language and template on the page. Add a language tag if needed.
2. Export the chapter translation request.
3. Download translate.py and reader-data.js.gz into the same folder.
4. Install the existing engine (Python 3.11+):

```sh
python -m pip install git+https://github.com/Acidfang/LanguageByField.git@0c2587896fe1bd4c6f8600cd344f186a12f9acf9
python translate.py --request your-request.json --output renderings.json
```

Without --ai this resolves exact existing ledger entries only. A missing entry stays unknown. Bit encoding alone does not supply a natural-language translation.

Optional generation uses the existing engine provider. Configure your API key locally, never in this website or repository. Select a provider model through OPENAI_MODEL or --model. Explicitly authorize generation for that run:

```sh
python translate.py --request your-request.json --output candidates.json --ai
```

This may incur API charges. The website itself makes no API translation request. Generated text remains a candidate and is not automatically written to the engine accepted translation ledger. Import the returned file through the website rendering-ledger control.

Use --scope book to select the request source book, or --scope corpus for all 929 retained chapters. These explicit scope changes may make many provider calls. The output is checkpointed after each chapter. Existing output files are not overwritten. Language coverage and quality depend on actual ledger records or the configured provider; universal translation accuracy is not claimed.

Source bytes and the full selected template are part of the existing engine request identity. Changing the template or language prevents an older exact request from silently serving as a new one. Results retain verse addresses, template identity, request and candidate identities, provider and unresolved distinctions. Missing, duplicate or changed verse addresses refuse that candidate instead of inventing text.

## Source

- [Download the retained reader carrier](reader-data.js.gz)
- [Westminster Leningrad Codex / OSHB v2.2](https://github.com/openscriptures/morphhb/releases/tag/v.2.2)
- [World English Bible rights](https://ebible.org/engwebp/copyright.htm)
- [Canonical WHY Translate engine](https://github.com/Acidfang/LanguageByField)

The retained Hebrew corpus has 39 book groupings, 929 chapters and 23,213 verse occurrences. The English alignment lacks matches at 202 Hebrew verse entries. Witness-numbering differences are not automatically repaired. Hebrew transcription and WEB text are public domain; OSHB morphology is CC BY 4.0. Source identities are shown in the page.

## Rendering ledger

JSON uses HEBREW-VERSE-RENDERINGS/1, the exact sourceRoot, and addressed records with sourceAddress, language, template, templateAddress, text and provenance. Generated records retain CANDIDATE. Manual assertions remain USER_PROVIDED. Calling an imported record verified does not make it verified.

Local renderings stay in browser storage until exported. Import is an explicit local act. Export does not publish your records. The source carrier is compressed only for delivery and verified after decompression. No private project files, keys or conversation records belong in this release.

## Full-Bible export
Choose Translation scope: Full Bible to export a request for all 929 chapters. The script honours that scope by default; --ai is still required for provider generation. After importing results, use Export full Bible text or JSON. Both cover all 39 books and 23,213 verse occurrences in the selected language/template, preserve candidate/reference status and mark missing verses UNTRANSLATED. A partial export is named partial; exporting does not generate missing text. JSON also retains source addresses, provenance and alternative records.
