/**
 * Annotate quotes with whether they can meet an arrive-by deadline.
 */
export function annotateArriveBy(quotes, arriveByIso) {
  if (!arriveByIso) {
    return quotes.map((quote) => ({ ...quote, meetsArriveBy: null }));
  }

  const deadline = new Date(arriveByIso).getTime();
  const now = Date.now();

  return quotes.map((quote) => {
    const arrivalMs = now + quote.etaMinutes * 60 * 1000;
    return {
      ...quote,
      meetsArriveBy: arrivalMs <= deadline,
      projectedArrivalIso: new Date(arrivalMs).toISOString(),
    };
  });
}
