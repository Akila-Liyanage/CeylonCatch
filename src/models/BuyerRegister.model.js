import mongoose from "mongoose";
const schema = mongoose.Schema;
const bregiSchema = new schema ({
          name : {
            type :  String , //dataType
            required : true , //validate
          },

           gmail : {
            type :  String , //dataType
            required : true , //validate
          },

          password : {
            type :  String , //dataType
            required : true , //validate
          },

          contact : {
            type : Number ,
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