// Includes List Flatting too parent[index].child....
const flattenObject = (obj, parentKey = '', res = {}) => {
    for (let key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            let propName = parentKey ? `${parentKey}.${key}` : key;
            if (Array.isArray(obj[key])) {
                obj[key].forEach((item, index) => {
                    if (typeof item === 'object' && item !== null && !(item instanceof Date)) {
                        this.flattenObject(item, `${propName}[${index}]`, res);
                    } else {
                        res[`${propName}[${index}]`] = item;
                    }
                });
            } else if (typeof obj[key] === 'object' && obj[key] !== null && !(obj[key] instanceof Date)) {
                this.flattenObject(obj[key], propName, res);
            } else {
                res[propName] = obj[key];
            }
        }
    }
    return res;
}