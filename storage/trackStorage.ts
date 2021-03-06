/**
 * Created with JetBrains WebStorm.
 * User: anton.kropp
 * Date: 3/24/13
 * Time: 12:10 PM
 * To change this template use File | Settings | File Templates.
 */


import schema = module("schema");

var storage = new schema.db();

var log = require("../utils/log");

export class trackStorage{

    pointFields(point:IDataPoint){
        return storage.extractMongoFields(point.toObject(), "dataPoints");
    }

    addTrack(user:IUser, name:string, callback:() => void){
        var track = storage.newTrack();

        track.user = user._id;

        track.name = name;

        track.save(callback);
    }

    safeRemoveTrack(trackId:string, user:IUser, callback:IErrorCallback){
        schema.Track.remove({
            _id: trackId,
            "user": user._id
        },callback);
    }

    getUserForTrack(track:ITrack, callback:(ITrack) => void){
        schema.Track.findOne({_id : track._id })
            .populate("user")
            .exec((err, tr:ITrack) =>{
                callback(tr);
            });
    }

    updateDataPointImpl(track:ITrack, point:IDataPoint, callback:(err:String) => void){
        schema.Track.update(
            {
                "_id": track._id,
                "dataPoints._id": point._id
            },
            {$set: this.pointFields(point)},
            null,
            (err, result) => {
                if(err){
                    log.debug("error updating datapoint: " + err);
                }
                callback(err)
            });
    }

    removeDataPoints(track:ITrack, points:IDataPoint[], callback:(err:String) => void){
        schema.Track.update({"_id": track._id},
            {
                $pull: { dataPoints: { _id : { $in : storage.extractIds(points)}}}
            },
            {multi: true, upsert: false},
            (err, item) => callback(err));

    }

    getTrack(trackId:string, callback:(ITrack) => void){
        schema.Track.findOne({_id : trackId}, (err, track) => {
            if(err){
                log.debug(err);
            }
            callback(track);
        });
    }

//    insertDataPoint(trackId:string, point:IDataPoint, callback:(ITrack) => void){
//        schema.Track.update(
//            { _id: trackId },
//            {
//                $push: { dataPoints : point }
//            },
//            {},
//            (err, numUpdate, response) => {
//                if(err){
//                    log.debug(err);
//                }
//                this.getTrack(trackId, callback);
//            }
//        )
//    }

    updateDataPoint(trackId:string, point:IDataPoint, callback:(ITrack) => void){
        if(point._id == null){
            this.getTrack(trackId, track => {
                track.dataPoints.push(point);
                track.save(() => callback(track));
            })
        }
        else{
            var track = storage.newTrack();
            track._id = storage.newObjectId(trackId);
            this.updateDataPointImpl(track, point, (err) => this.getTrack(trackId, callback));
        }
    }
}
