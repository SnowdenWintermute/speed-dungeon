export default class CustomError extends Error {
  constructor(
    public message: string,
    public status: number,
    public field: null | string = null
  ) {
    super(message);
  }
}
