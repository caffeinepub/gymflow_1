import Text "mo:core/Text";
import Map "mo:core/Map";
import Array "mo:core/Array";
import Iter "mo:core/Iter";
import Time "mo:core/Time";
import Runtime "mo:core/Runtime";
import Nat "mo:core/Nat";
import Float "mo:core/Float";
import Order "mo:core/Order";
import Principal "mo:core/Principal";

actor {
  type MuscleGroup = {
    #borst;
    #rug;
    #schouders;
    #biceps;
    #triceps;
    #benen;
    #billen;
    #core;
    #cardio;
  };

  type EquipmentType = {
    #barbell;
    #dumbbell;
    #cable;
    #machine;
    #bodyweight;
    #cardio_machine;
  };

  type DayType = {
    #kracht;
    #cardio;
    #rust;
  };

  type Exercise = {
    id : Nat;
    name : Text;
    muscleGroup : MuscleGroup;
    equipment : EquipmentType;
    alternatives : [Nat];
  };

  module Exercise {
    public func compareById(ex1 : Exercise, ex2 : Exercise) : Order.Order {
      Nat.compare(ex1.id, ex2.id);
    };
  };

  type ScheduledExercise = {
    primaryId : Nat;
    activeId : Nat;
  };

  type WorkoutSet = {
    reps : Nat;
    weight : Float;
  };

  module WorkoutSet {
    public func compareByWeight(set1 : WorkoutSet, set2 : WorkoutSet) : Order.Order {
      Float.compare(set1.weight, set2.weight);
    };
  };

  type ExerciseLog = {
    exerciseId : Nat;
    exerciseName : Text;
    sets : [WorkoutSet];
  };

  type WorkoutSession = {
    dayType : DayType;
    date : Text;
    exercises : [ExerciseLog];
  };

  type UserSettings = {
    schedule : [DayType];
    exerciseMapping : [[ScheduledExercise]];
  };

  type User = {
    id : Principal;
    settings : UserSettings;
    logs : [WorkoutSession];
  };

  let users = Map.empty<Principal, User>();

  func getNextId(mapSize : Nat) : Nat {
    mapSize + 1;
  };

  func defaultWorkoutSession() : WorkoutSession {
    {
      dayType = #kracht;
      date = Time.now().toText();
      exercises = [];
    };
  };

  public shared ({ caller }) func register() : async () {
    if (users.containsKey(caller)) { Runtime.trap("Gebruiker bestaat al.") };

    let newUser : User = {
      id = caller;
      settings = {
        schedule = [#kracht, #kracht, #kracht, #kracht, #kracht, #cardio, #rust];
        exerciseMapping = [[{ primaryId = 1; activeId = 1 }]];
      };
      logs = [defaultWorkoutSession()];
    };
    users.add(caller, newUser);
  };

  func getUserHelper(userId : Principal) : User {
    switch (users.get(userId)) {
      case (?user) { user };
      case (null) { Runtime.trap("Gebruiker niet gevonden.") };
    };
  };

  public shared ({ caller }) func logWorkout(workoutSession : WorkoutSession) : async () {
    let user = getUserHelper(caller);
    let updatedLogs = user.logs.concat([workoutSession]);
    let updatedUser : User = { user with logs = updatedLogs };
    users.add(caller, updatedUser);
  };

  public query ({ caller }) func getAllLogs() : async [WorkoutSession] {
    let user = getUserHelper(caller);
    user.logs;
  };

  public shared ({ caller }) func updateSchedule(dayIndex : Nat, dayType : DayType) : async () {
    let user = getUserHelper(caller);
    if (dayIndex >= 7) { Runtime.trap("Ongeldige dag index.") };

    let newSchedule = Array.tabulate(
      7,
      func(i) {
        if (i == dayIndex) { dayType } else { user.settings.schedule[i] };
      },
    );

    let updatedUser = {
      user with
      settings = {
        user.settings with
        schedule = newSchedule
      }
    };
    users.add(caller, updatedUser);
  };
};
