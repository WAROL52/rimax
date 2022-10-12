export default class Month{


    constructor(year,month){
        this.year=year
        this.month=month
        this.start=new Date(this.year,this.month)
    }

    getName(){
        return this.start.toLocaleString("fr-fr",{month:"long"})
    }

    getDays(){
        let days=[]
        let dayOfWeek=this.start.getDay()-1
        if(dayOfWeek===-1){
            dayOfWeek=6
        }
        if(dayOfWeek>0){
            for(let i=dayOfWeek;i>0;i--){
                let date=this.clone(this.start)
                date.setDate(i*-1+1)
                days.push(date)
            }
        }
        let end=this.clone(this.start)
        end.setMonth(end.getMonth()+1)
        end.setDate(0)
        for(let i=0;i<end.getDate();++i){
            let date=this.clone(this.start)
            date.setDate(i+1)
            days.push(date)
        }

        dayOfWeek=end.getDay()-1
        if(dayOfWeek===-1){
            dayOfWeek=6
        }
        if(dayOfWeek<6){
            for(let i=0;i<(6-dayOfWeek);i++){
                let date=this.clone(end)
                date.setDate(end.getDate()+i+1)
                days.push(date)
            }
        }
        return days
    }
    clone(date){
        return new Date(date.getTime())
    }
    contains(date){
        return date.getMonth()===this.month
    }
    static createMonthsForYear(year){
        const months=[]
        for(let i=0;i<12;i++){
            months.push(new Month(year,i))
        }
        return months
    }
}