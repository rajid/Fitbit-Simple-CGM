// Add zero in front of numbers < 10
export function zeroPad(i) {
  
  if (i < 10) {
    i = "0" + i;
  }
  return i;
}

// From "PedanticAvenger" on Fitbit "nightscout" Dismiss channel :)
export function mmol( bg ) {
  let mmolBG = (bg / 18.0182);
  let rmmol = (Math.floor((mmolBG * 10) + 0.5)) / 10;
  return rmmol;
}

export function Min2ms(x) {
  return (x * 60 * 1000);
}

export function Hour2ms(x) {
  return (60 * Min2ms(x));
}

export function Day2ms(x) {
  return (24 * Hour2ms(x));
}
