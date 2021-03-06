/*
 * Copyright 2014-2015 Metamarkets Group Inc.
 * Copyright 2015-2016 Imply Data, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { expect } from "chai";
import * as hasOwnProp from 'has-own-prop';

export interface TesterOptions {
  newThrows?: boolean;
  context?: any;
}

const PROPERTY_KEYS = [
  'name',
  'defaultValue',
  'possibleValues',
  'validate',
  'immutableClass',
  'immutableClassArray',
  'immutableClassLookup',
  'equal',
  'toJS',
  'type',
  'contextTransform',
  'preserveUndefined',
  'emptyArrayIsOk'
];

/**
 * Checks it a given Class conforms to the Immutable Class guidelines by applying it to a given set of instances
 * @param ClassFn - The constructor function of the class to test
 * @param objects - An array of JS values to test on
 * @param options - Some testing options
 */
export function testImmutableClass<TypeJS>(ClassFn: any, objects: TypeJS[], options: TesterOptions = {}) {
  if (typeof ClassFn !== 'function') throw new TypeError(`ClassFn must be a constructor function`);
  if (!Array.isArray(objects) || !objects.length) {
    throw new TypeError(`objects must be a non-empty array of js to test`);
  }
  let newThrows = options.newThrows;
  let context = options.context;

  // Check class name
  let className = ClassFn.name;
  if (className.length < 1) throw new Error(`Class must have a name of at least 1 letter`);
  let instanceName = className[0].toLowerCase() + className.substring(1);

  // Check static methods
  expect(ClassFn.fromJS, `${className}.fromJS should exist`).to.be.a('function');

  // Check instance methods
  let instance = ClassFn.fromJS(objects[0], context);
  let objectProto = Object.prototype;
  expect(instance.valueOf, `Instance should implement valueOf`).to.not.equal(objectProto.valueOf);
  expect(instance.toString, `Instance should implement toString`).to.not.equal(objectProto.toString);
  expect(instance.toJS, `Instance should have a toJS function`).to.be.a('function');
  expect(instance.toJSON, `Instance should have a toJSON function`).to.be.a('function');
  expect(instance.equals, `Instance should have an equals function`).to.be.a('function');

  // Check properties
  if (ClassFn.PROPERTIES) { // Only new style classes have these
    expect(ClassFn.PROPERTIES, 'PROPERTIES should be an array').to.be.an('array');
    ClassFn.PROPERTIES.forEach((property: any) => {
      Object.keys(property).forEach(key => {
        expect(PROPERTY_KEYS).to.include(key);
        expect(property.name).to.be.a('string');
      })
    });
  }

  // Preserves
  for (let i = 0; i < objects.length; i++) {
    let where = `[in object ${i}]`;
    let objectJSON = JSON.stringify(objects[i]);
    let objectCopy1 = JSON.parse(objectJSON);
    let objectCopy2 = JSON.parse(objectJSON);

    let inst = ClassFn.fromJS(objectCopy1, context);
    expect(objectCopy1, `${className}.fromJS function modified its input :-(`).to.deep.equal(objectCopy2);

    expect(
      inst,
      `${className}.fromJS did not return a ${className} instance ${where}`
    ).to.be.instanceOf(ClassFn);

    expect(
      inst.toString(),
      `${instanceName}.toString() must return a string ${where}`
    ).to.be.a('string');

    expect(
      inst.equals(null),
      `${instanceName}.equals(null) should be false ${where}`
    ).to.equal(false);

    expect(
      inst.equals([]),
      `${instanceName}.equals([]) should be false ${where}`
    ).to.equal(false);

    expect(
      inst.toJS(),
      `${className}.fromJS(obj).toJS() was not a fixed point (did not deep equal obj) ${where}`
    ).to.deep.equal(objects[i]);

    let instValueOf = inst.valueOf();
    expect(
      inst.equals(instValueOf),
      `inst.equals(inst.valueOf()) ${where}`
    ).to.equal(false);

    let instLazyCopy: any = {};
    for (let key in inst) {
      if (!hasOwnProp(inst, key)) continue;
      instLazyCopy[key] = inst[key];
    }

    expect(
      inst.equals(instLazyCopy),
      `inst.equals(*an object with the same values*) ${where}`
    ).to.equal(false);

    if (newThrows) {
      expect(() => {
        new ClassFn(instValueOf);
      }, `new ${className} did not throw as indicated ${where}`).to.throw(Error)
    } else {
      let instValueCopy = new ClassFn(instValueOf);
      expect(
        inst.equals(instValueCopy),
        `new ${className}().toJS() is not equal to the original ${where}`
      ).to.equal(true);
      expect(
        instValueCopy.toJS(),
        `new ${className}(${instanceName}.valueOf()).toJS() returned something bad ${where}`
      ).to.deep.equal(inst.toJS());
    }

    let instJSONCopy = ClassFn.fromJS(JSON.parse(JSON.stringify(inst)), context);
    expect(inst.equals(instJSONCopy), `JS Copy does not equal original ${where}`).to.equal(true);
    expect(
      instJSONCopy.toJS(),
      `${className}.fromJS(JSON.parse(JSON.stringify(${instanceName}))).toJS() returned something bad ${where}`
    ).to.deep.equal(inst.toJS());
  }

  // Objects are equal only to themselves
  for (let j = 0; j < objects.length; j++) {
    let objectJ = ClassFn.fromJS(objects[j], context);
    for (let k = j; k < objects.length; k++) {
      let objectK = ClassFn.fromJS(objects[k], context);
      expect(
        objectJ.equals(objectK),
        `Equality of objects ${j} and ${k} was wrong`
      ).to.equal(j === k);
    }
  }
}
