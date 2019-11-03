const mongoose = require('mongoose');

class QueryProxy {
  constructor(query = new mongoose.Query(), pathHierarchy = [], isGet = false) {
    this._query = query;
    if (pathHierarchy.length > 0) {
      this.parse(pathHierarchy, isGet);
    }
    return new Proxy(this, {
      get(target, prop, receiver) {
        return target[prop] || Reflect.get(target._query, prop, receiver);
      },
    });
  }

  addSubDocumentIdCondition(subDocumentName, id) {
    if (!subDocumentName || !id) {
      return;
    }
    const schema = this._query.model.schema;
    if ((schema.paths[subDocumentName] || {}).$isMongooseDocumentArray && id) {
      this._query.and([{ [`${subDocumentName}._id`]: id }]);
    }
  }

  setProjection(collectionHierarchy = this.collectionHierarchy) {
    let selectExp = '';
    collectionHierarchy.forEach((value, index) => {
      selectExp += `${selectExp ? ' ' : ''}+${collectionHierarchy
        .slice(0, index + 1)
        .join('.')}`;
    });
    if (selectExp) {
      this.projectionExp = selectExp;
      this._query.select(selectExp);
    }
  }

  setPopulation(
    targetArray = this.targetArray || {},
    targetElement = this.targetElement,
  ) {
    const targetArrayOptions = targetArray.options || {};
    if (
      targetArrayOptions.ref ||
      (targetElement && (targetArrayOptions.type || []).some(t => t.ref))
    ) {
      this.population = targetArray.path;
      let schemaPath = {};
      if (this._query.schema.virtuals[targetArray.path]) {
        const { ref, foreignField } = this._query.schema.virtuals[
          targetArray.path
        ].options;
        schemaPath = this._query.model.model(ref).schema.paths[
          foreignField.split('.')[0]
        ];
      }
      this._query.populate({
        path: targetArray.path,
        select: schemaPath.$isMongooseDocumentArray
          ? `${targetArray.path}.$`
          : '',
      });
    }
  }

  parse(pathHierarchy, isGet = false) {
    let pathClone = [...pathHierarchy];

    let targetSchema = this._query.model.schema;
    let collectionHierarchy = [];
    let targetArray;
    let targetElement;

    for (let index = 0; index < pathClone.length; index++) {
      const schemaPath = targetSchema.paths[pathClone[index]];
      if (schemaPath) {
        if (schemaPath.schema) {
          collectionHierarchy.push(schemaPath.path);
          targetSchema = schemaPath.schema;
        } else if (schemaPath.instance === 'Buffer') {
          collectionHierarchy.push(schemaPath.path);
          break;
        } else {
          if (schemaPath.$isMongooseArray) {
            targetArray = schemaPath;
            if (pathClone[index + 1]) {
              targetElement = pathClone[index + 1];
            }
          } else {
            targetElement = schemaPath.path;
          }
          break;
        }
      } else if (
        ((targetSchema.virtuals[pathClone[index]] || {}).options || {}).ref
      ) {
        targetArray = targetSchema.virtuals[pathClone[index]];
        if (
          pathClone[index + 1] &&
          !targetSchema.virtuals[pathClone[index]].options.justOne
        ) {
          targetElement = pathClone[index + 1];
        }
      } else {
        pathClone.splice(index, 1);
        index--;
      }
    }

    this.targetSchema = targetSchema;
    this.collectionHierarchy = collectionHierarchy;
    this.targetArray = targetArray;
    this.targetElement = targetElement;

    this.addSubDocumentIdCondition(pathHierarchy[0], pathHierarchy[1]);
    this.setProjection(collectionHierarchy);
    if (isGet) {
      this.setPopulation(targetArray, targetElement);
    }

    return [targetSchema, collectionHierarchy, targetArray, targetElement];
  }
}

module.exports = QueryProxy;
