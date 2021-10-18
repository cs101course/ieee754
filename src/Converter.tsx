import * as React from "react";

import "./Converter.css";

interface ConverterProps {}
interface ConverterState {
  arrayBuffer: ArrayBuffer;
  dataView: DataView;
}

const Frac = ({ num, denomPow }: { num: number; denomPow: number }) => (
  <>
    <sup>{num}</sup>&frasl;
    <sub>
      {denomPow <= 6 ? (
        Math.pow(2, denomPow)
      ) : (
        <>
          2<sup>{denomPow}</sup>
        </>
      )}
    </sub>
  </>
);

export const Converter = ({}: ConverterProps) => {
  const [fracIndex, setFracIndex] = React.useState<number>(-1);
  const [typedBinary, setTypedBinary] = React.useState<string>("");
  const [typedFloat, setTypedFloat] = React.useState<string>("0.90624999");
  const [state, setState] = React.useState<ConverterState>(() => {
    const arrayBuffer = new ArrayBuffer(4);
    const dataView = new DataView(arrayBuffer);
    return {
      arrayBuffer,
      dataView,
    };
  });

  const setFloat = (float: number) => {
    state.dataView.setFloat32(0, float, true);
    setState({
      ...state,
    });
  };

  const setBinary = (binary: string) => {
    const intRepr = Number.parseInt(binary, 2);

    state.dataView.setUint32(0, intRepr || 0, true);
    setState({
      ...state,
    });
  };

  const binaryVal = state.dataView
    .getUint32(0, true)
    .toString(2)
    .padStart(32, "0");
  const floatVal = state.dataView.getFloat32(0, true);
  const binaryDigits = binaryVal.split("");
  const signEncoded = binaryDigits[0];
  const sign = signEncoded === "0" ? "+" : "-";
  const exponentEncoded = Number.parseInt(binaryDigits.slice(1, 9).join(""), 2);
  const exponent = exponentEncoded - 127;
  const fractionEncoded = binaryDigits
    .slice(9)
    .map((digit, index) => ({ digit, denom: index + 1 }))
    .filter((frac) => frac.digit === "1");
  const fractionFloat = fractionEncoded.reduce((prev: number, curr) => {
    return prev + (1/Math.pow(2, curr.denom));
  }, 1);

  const onFloatTextChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
    setTypedFloat(evt.currentTarget.value);
    setTypedBinary("");
  };

  const onBinaryTextChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
    const val = evt.currentTarget.value
      .split("")
      .map((char) => (char === "0" ? "0" : "1"))
      .join("");
    setTypedBinary(val);
    setTypedFloat("");
  };

  const onBinaryTextBlur = (evt: React.FocusEvent<HTMLInputElement>) => {
    const val = evt.currentTarget.value
      .split("")
      .map((char) => (char === "0" ? "0" : "1"))
      .join("");
    setTypedBinary(val.padStart(32, "0"));
  };

  const onDigitOver = (index: number) => () => {
    const thisFracIndex = index - 9;
    if (
      thisFracIndex === fracIndex ||
      thisFracIndex < 0 ||
      thisFracIndex > 23
    ) {
      setFracIndex(-1);
    } else {
      setFracIndex(thisFracIndex);
    }
  };

  const onDigitLeave = () => {
    setFracIndex(-1);
  }

  React.useEffect(() => {
    setBinary(typedBinary);
  }, [typedBinary]);

  React.useEffect(() => {
    setFloat(Number.parseFloat(typedFloat));
  }, [typedFloat]);

  const fractions = Array(23)
    .fill(0)
    .map((_, index) => (
      <div key={index} className="fractionHeader">
        {fracIndex === index && <Frac num={1} denomPow={index + 1} />}
      </div>
    ));

  return (
    <div className="converter">
      <div className="inputs">
        <div>The 32-bit floating point number</div>
        <input
          type="text"
          className="floatInput"
          value={typedFloat || (Number.isNaN(floatVal) ? "" : floatVal)}
          onChange={onFloatTextChange}
        />
        <div>is represented in binary as:</div>
        <input
          type="text"
          className="binaryInput"
          value={typedBinary || binaryVal}
          onChange={onBinaryTextChange}
          onBlur={onBinaryTextBlur}
        />
        <div>which has the (actual) value:</div>
        <input type="text" className="floatInput" value={floatVal} readOnly />
      </div>
      <div className="boxes">
        <div className="digits">
          <div className="headSpace"></div>
          <>{fractions}</>
          <div className="spacer"></div>
          <>
            {binaryDigits.map((digit, digitIndex) => {
              let classNames = ["digit"];
              if (digitIndex === 0) {
                classNames.push("sign");
              } else if (digitIndex < 9) {
                classNames.push("exponent");
              } else {
                classNames.push("fraction");
              }

              return (
                <div
                  key={digitIndex}
                  className={classNames.join(" ")}
                  onMouseEnter={onDigitOver(digitIndex)}
                  onMouseLeave={onDigitLeave}
                >
                  {digit}
                </div>
              );
            })}
            <div className="signLabel">
              sign
              <br />
              <b>{signEncoded}</b>
            </div>
            <div className="exponentLabel">
              exponent
              <br />
              <b>{exponentEncoded}</b>
            </div>
            <div className="fractionLabel">
              fraction
              <br />
              <span className="fractions">
                1
                {fractionEncoded.map((frac, index) => (
                  <span key={index}>
                    <span> + </span>
                    <Frac num={1} denomPow={frac.denom} />
                  </span>
                ))}
              </span>
            </div>
            <div className="signValue signCalculated">{sign}</div>
            <div className="exponentValue">
              ({exponentEncoded}
              <span className="calculation"> - 127</span>) = <b className="exponentCalculated">{exponent}</b>
            </div>
            <div className="fractionValue fractionCalculated">{fractionFloat}</div>
          </>
        </div>
        <div className="finalCalculation">
          <span><b className="signCalculated">{sign}</b></span>
            <span> </span>
          <span>2<sup><b className="exponentCalculated">{exponent}</b></sup></span>
          <span> &times; </span>
          <span><b className="fractionCalculated">{fractionFloat}</b></span>
          <span> = </span>
          <span className="resultCalculated"> { Number.isNaN(floatVal) ? "Exponent too big (NaN)" : floatVal }</span>
        </div>
      </div>
    </div>
  );
};
