export interface ErrorRecord {
  message: string;
  clientIntentSequenceId: number;
}

export class ErrorRecordService {
  private _errors: ErrorRecord[] = [];

  record(message: string, clientIntentSequenceId: number) {
    this._errors.push({ message, clientIntentSequenceId });
  }

  getErrors(): readonly ErrorRecord[] {
    return this._errors;
  }

  get count() {
    return this._errors.length;
  }

  getLastError(): ErrorRecord | undefined {
    return this._errors[this._errors.length - 1];
  }

  getErrorForIntent(clientIntentSequenceId: number): ErrorRecord | undefined {
    return this._errors.find((e) => e.clientIntentSequenceId === clientIntentSequenceId);
  }

  clear() {
    this._errors = [];
  }
}
