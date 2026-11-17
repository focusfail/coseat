![coseat - Logo](https://github.com/focusfail/coseat/blob/master/logo.svg)

---
Post-flight motor analysis using a machine learning model.

> [!NOTE]
> This project is experimental and not intended for production or operational use.

## features
- supports Garmin G1000 and X-Plane 12 logs
- view flight logs in a graph
- ml model detects motor faults and displays them
- database

## how to run
**prerequisites**:
- [npm](https://www.npmjs.com/)
- [just](https://github.com/casey/just)
- [uv](https://docs.astral.sh/uv/)

```sh
git clone https://github.com/focusfail/coseat.git
cd coseat
npm i
just serve
```

