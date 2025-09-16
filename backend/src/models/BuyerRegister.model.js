import mongoose from "mongoose";
const schema = mongoose.Schema;
const bregiSchema = new schema ({
          name : {
            type :  String , //dataType
            required : true , //validate
          },

           email : {
            type :  String , //dataType
            required : true , //validate
            unique: true,
          },

          password : {
            type :  String , //dataType
            required : true , //validate
          },

          contact : {
            type : String ,
            required : true ,
          },

           address : {
            type :  String , //dataType
            required : true , //validate
          },

           btype : {
            type :  String , //dataType
            required : true , //validate
          },

         
});


const BuyerRegister = mongoose.model("BuyerRegister",bregiSchema);
export default BuyerRegister;