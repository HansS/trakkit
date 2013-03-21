/**
 * Created with JetBrains WebStorm.
 * User: anton.kropp
 * Date: 3/14/13
 * Time: 4:11 PM
 * To change this template use File | Settings | File Templates.
 */

///<reference path="../def/all.d.ts"/>
///<reference path="../storage/schema.ts"/>

import schema = module("../storage/schema");

var storage = new schema.db();

export var group = {
    init: (t:ITest) =>{
        storage.init("test", true);
        schema.User.remove({}, () => schema.DataPoint.remove({}, () => t.done()));
    },

    test: (t:ITest) =>{
        var u = storage.newUser();

        u.name = "test";

        u.save(()=> {
            schema.User.findOne(u._id, (err, user) => {
                console.log(user.name);

                schema.User.find(u._id)
                    .where("_id").equals(u._id)
                    .exec((err, u1) => {
                        console.log(u1);

                        t.equal(u1[0].name, u.name);
                        t.done();
                    });
            });
        });
    },

    manyPoints: (t:ITest) =>{
        var u = storage.newUser();
        u.name = "manyPoints";
        u.save(() =>{

            var dpList = new IDataPoint[];

            for(var i = 0;i<100;i++){
                var dp = storage.newDataPoint();
                dp.xAxis = "x" + i;
                dp.yAxis = "y" + i;
                dp.user = u;
                dpList.push(dp);
            }

            storage.saveAll(dpList, ()=>{
                console.log(u._id);

                var id = storage.newObjectId(u._id);

                schema.DataPoint.find({"user._id" : u._id }, (err, dataPoints) => {
                    console.log(dataPoints);
                    t.done();
                })
            });

        })
    },

    end: (t:ITest) =>{
        storage.disconnect();
        t.done();
    }
}