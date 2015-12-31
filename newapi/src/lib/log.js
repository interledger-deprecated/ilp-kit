import hub from 'mag-hub'
import mag from 'mag'
import { Log } from 'five-bells-shared'
import { ValueFactory } from 'constitute'

export default new ValueFactory(Log(mag, hub))