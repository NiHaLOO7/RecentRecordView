public with sharing class UserInfoController {
    @AuraEnabled(cacheable=true)
    public static Map<String, Boolean> isSystemAdmin() {
        try{
            List<User> users = Security.stripInaccessible(
                AccessType.READABLE, [SELECT Profile.Name FROM User WHERE Id = :UserInfo.getUserId()]
            ).getRecords();
            return new Map<String, Boolean>{'isAdmin' => users.isEmpty() ? false : users[0].Profile.Name == System.Label.RR_System_Administrator};
        }
        catch(Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }
}