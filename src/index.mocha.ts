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

import { testImmutableClass } from './index';

export function isInstanceOf(thing: any, constructor: any): boolean {
  if (typeof constructor !== 'function') throw new TypeError("constructor must be a function");
  if (thing instanceof constructor) return true;
  if (thing == null) return false;
  let constructorName: string = constructor.name;
  if (!constructorName) return false;
  let thingProto: any = thing.__proto__;
  while (thingProto && thingProto.constructor) {
    if (thingProto.constructor.name === constructorName) return true;
    thingProto = thingProto.__proto__;
  }
  return false;
}

class Animal {
  static fromJS(name: string) {
    // Removes hashtags
    name = name.replace(/^#/, '');
    return new Animal(name);
  }

  static isAnimal(animal: Animal) {
    return isInstanceOf(animal, Animal);
  }

  public name: string;

  constructor(name: string) {
    this.name = name;
  }

  public toString() {
    return this.name;
  }

  public valueOf() {
    return this.name;
  }

  public toJS() {
    return this.name;
  }

  public toJSON() {
    return this.name;
  }

  public equals(other: Animal) {
    return Animal.isAnimal(other) && this.name === other.name;
  }
}

class AnimalNoFromJS {
  static isAnimalNoFromJS(animal: Animal) {
    return isInstanceOf(animal, AnimalNoFromJS);
  }

  public name: string;

  constructor(name: string) {
    this.name = name;
  }
}


class AnimalBadToJS {
  static fromJS(name: string) {
    return new AnimalBadToJS(name);
  }

  static isAnimalBadToJS(animal: AnimalBadToJS) {
    return isInstanceOf(animal, AnimalBadToJS);
  }

  public name: string;

  constructor(name: string) {
    this.name = name;
  }

  public toString() {
    return this.name;
  }

  public valueOf() {
    return this.name;
  }

  public toJS() {
    return 'Bad ' + this.name;
  }

  public toJSON() {
    return this.name;
  }

  public equals(other: AnimalBadToJS) {
    return AnimalBadToJS.isAnimalBadToJS(other) && this.name === other.name;
  }
}

class AnimalWithContext {
  static fromJS(name: string, animalWeights: any) {
    let w: number = animalWeights[name];
    if (!w) throw new Error("unknown animal (it has no weight)");
    return new AnimalWithContext({
      n: name,
      w: w
    });
  }

  static isAnimalWithContext(animal: AnimalWithContext) {
    return isInstanceOf(animal, AnimalWithContext);
  }

  public name: string;
  public weight: number;

  constructor(p: any) {
    this.name = p.n;
    this.weight = p.w;
  }

  public toString() {
    return this.name;
  }

  public valueOf() {
    return { n: this.name }
  }

  public toJS() {
    return this.name;
  }

  public toJSON() {
    return this.name;
  }

  public equals(other: AnimalWithContext) {
    return AnimalWithContext.isAnimalWithContext(other) && this.name === other.name;
  }
}

describe("testImmutableClass", () => {
  it("works for Animal class", () => {
    testImmutableClass(Animal, [
      "Koala",
      "Snake",
      "Dog",
      "Cat"
    ])
  });

  it("fails when given non fixed point js", () => {
    expect(() => {
      testImmutableClass(Animal, [
        "Koala",
        "Snake",
        "Dog",
        "#Cat"
      ])
    }).to.throw(Error, "Animal.fromJS(obj).toJS() was not a fixed point (did not deep equal obj) [in object 3]: expected 'Cat' to deeply equal '#Cat'")
  });

  it("rejects AnimalNoFromJS class", () => {
    expect(() => {
      testImmutableClass(AnimalNoFromJS, [
        "Koala",
        "Snake",
        "Dog"
      ])
    }).to.throw(Error, 'AnimalNoFromJS.fromJS should exist: expected undefined to be a function')
  });

  it("rejects AnimalBadToJS class", () => {
    expect(() => {
      testImmutableClass(AnimalBadToJS, [
        "Koala",
        "Snake",
        "Dog"
      ])
    }).to.throw(Error, "AnimalBadToJS.fromJS(obj).toJS() was not a fixed point (did not deep equal obj) [in object 0]: expected 'Bad Koala' to deeply equal 'Koala'")
  });

  it("works for AnimalWithContext class (with context)", () => {
    let animalWeights = {
      "Koala": 5,
      "Snake": 4,
      "Dog": 12
    };
    testImmutableClass(AnimalWithContext, [
      "Koala",
      "Snake",
      "Dog"
    ], {
      context: animalWeights
    })
  });

});
