const _ = require('lodash')
const isEmpty = value => value === undefined || value === null || value === ''
const join = (rules) => (value, data) => rules.map(rule => rule(value, data)).filter(error => !!error)[0] /* first error */

export function email (value) {
  // Let's not start a debate on email regex. This is just for an example app!
  if (!isEmpty(value) && !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,63}$/i.test(value)) {
    return 'Invalid email address'
  }
}

export function required (value) {
  if (isEmpty(value)) {
    return 'Required'
  }
}

export function minLength (min) {
  return value => {
    if (!isEmpty(value) && value.length < min) {
      return `Must be at least ${min} characters`
    }
  }
}

export function maxLength (max) {
  return value => {
    if (!isEmpty(value) && value.length > max) {
      return `Must be no more than ${max} characters`
    }
  }
}

export function integer (value) {
  if (value && !Number.isInteger(Number(value))) {
    return 'Must be an integer'
  }
}

export function number (value) {
  if ((value && isNaN(parseFloat(value))) || !isFinite(value)) {
    return 'Must be a number'
  }
}

export function minValue (min) {
  return value => {
    if (value && value < min) {
      return `Must be at least ${min}`
    }
  }
}

export function maxValue (max) {
  return value => {
    if (value && value > max) {
      return `Must be no more than ${max}`
    }
  }
}

export function greaterThanMinBalance (balance, minBalance) {
  return value => {
    if (value && parseFloat(balance) - parseFloat(value) < parseFloat(minBalance)) {
      return `Minimum allowed balance is ${minBalance}.`
    }
  }
}

export function oneOf (enumeration) {
  return value => {
    if (!~enumeration.indexOf(value)) {
      return `Must be one of: ${enumeration.join(', ')}`
    }
  }
}

export const hostname = value => {
  if (!/^(([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9])\.)*([A-Za-z0-9]|[A-Za-z0-9][A-Za-z0-9-]*[A-Za-z0-9])$/i.test(value)) {
    return 'Invalid hostname'
  }
}

export const hostnameNotSelf = value => {
  if (location.hostname === value) {
    return 'You cannot be your own peer'
  }
}

export const peerHostname = existingPeers => {
  return value => {
    if (_.find(existingPeers, ['hostname', value])) {
      return `There's already a peering with ${value}`
    }
  }
}

export function match (field) {
  return (value, data) => {
    if (data) {
      if (value !== data[field]) {
        return 'Do not match'
      }
    }
  }
}

export function uuid (value) {
  if (!isEmpty(value) && !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) {
    return 'Invalid'
  }
}

export function username (value) {
  if (value && value.length > 1 && !/^[a-z0-9]([a-z0-9]|[-](?!-)){0,18}[a-z0-9]$/.test(value)) {
    return 'Username must be 2-20 characters, lowercase letters, numbers and hyphens ("-") only, with no two or more consecutive hyphens.'
  }
}

export function createValidator (rules) {
  return (data = {}) => {
    const errors = {}
    Object.keys(rules).forEach((key) => {
      const rule = join([].concat(rules[key])) // concat enables both functions and arrays of functions
      const error = rule(data[key], data)
      if (error) {
        errors[key] = error
      }
    })
    return errors
  }
}
