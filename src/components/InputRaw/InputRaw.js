import React, {Component, PropTypes} from 'react'

export default class InputRaw extends Component {
  static propTypes = {
    object: PropTypes.object
  }

  domOnlyProps = (object) => {
    const newObject = {...object}
    delete newObject.initialValue
    delete newObject.autofill
    delete newObject.onUpdate
    delete newObject.valid
    delete newObject.invalid
    delete newObject.dirty
    delete newObject.pristine
    delete newObject.active
    delete newObject.touched
    delete newObject.visited
    delete newObject.autofilled
    delete newObject.error

    return newObject
  }

  render() {
    const { object, ...rest } = this.props

    const props = {
      ...this.domOnlyProps(object),
      ...rest
    }

    if (rest.type === 'textarea') {
      return <textarea {...props} />
    }

    return <input {...props} />
  }
}
